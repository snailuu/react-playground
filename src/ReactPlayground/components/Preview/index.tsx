import { debounce } from 'lodash-es'
import { useContext, useEffect, useRef, useState } from 'react'
import { IMPORT_MAP_FILE_NAME } from '../../files'
import { PlaygroundContext } from '../../PlaygroundContext'
import { Message } from '../Message'
import CompilerWorker from './compiler.worker?worker'
import iframeRaw from './iframe.html?raw'

interface MessageData {
  data: {
    type: string
    message: string
  }
}

// 定义BroadcastChannel名称常量
const BROADCAST_CHANNEL_NAME = 'react-playground-updates'

export default function Preview() {
  const { files } = useContext(PlaygroundContext)
  const [compiledCode, setCompiledCode] = useState('')
  const [error, setError] = useState('')
  const compilerWorkerRef = useRef<Worker>()
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null)

  // 初始化编译工作线程和广播通道
  useEffect(() => {
    if (!compilerWorkerRef.current) {
      compilerWorkerRef.current = new CompilerWorker()
      compilerWorkerRef.current.addEventListener('message', ({ data }) => {
        console.log('worker', data)
        if (data.type === 'COMPILED_CODE') {
          setCompiledCode(data.data)
          // setError('');

          // 广播编译后的代码更新
          if (broadcastChannelRef.current) {
            broadcastChannelRef.current.postMessage({
              type: 'CODE_UPDATE',
              compiledCode: data.data,
              importMap: files[IMPORT_MAP_FILE_NAME].value,
            })
          }
        }
        else {
          // console.log('error', data);
        }
      })
    }

    // 初始化BroadcastChannel
    if (!broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
      }
      catch (e) {
        console.error('BroadcastChannel不受支持', e)
      }
    }

    return () => {
      // 清理BroadcastChannel
      broadcastChannelRef.current?.close()
      broadcastChannelRef.current = null
    }
  }, [files])

  useEffect(
    debounce(() => {
      compilerWorkerRef.current?.postMessage(files)
    }, 500),
    [files],
  )

  const getIframeUrl = () => {
    const res = iframeRaw
      .replace(
        '<script type="importmap"></script>',
        `<script type="importmap">${files[IMPORT_MAP_FILE_NAME].value}</script>`,
      )
      .replace(
        '<script type="module" id="appSrc"></script>',
        `<script type="module" id="appSrc">${compiledCode}</script>`,
      )
    return URL.createObjectURL(new Blob([res], { type: 'text/html' }))
  }

  useEffect(() => {
    setIframeUrl(getIframeUrl())
    console.log('getIframeUrl', getIframeUrl())
  }, [files[IMPORT_MAP_FILE_NAME].value, compiledCode])

  const [iframeUrl, setIframeUrl] = useState(getIframeUrl())

  const handleMessage = (msg: MessageData) => {
    const { type, message } = msg.data
    console.log('handleMessage', type, message)
    if (type === 'ERROR') {
      setError(message)
    }
  }

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  // 添加在新标签页打开的功能
  const openInNewTab = () => {
    const newTabUrl = getIframeUrl()
    const newTab = window.open(newTabUrl, '_blank')

    // 可以将必要的更新监听代码注入到新页面
    if (newTab) {
      newTab.addEventListener('load', () => {
        const setupCode = `
					// 设置接收更新的广播通道
					try {
						const channel = new BroadcastChannel('${BROADCAST_CHANNEL_NAME}');
						channel.addEventListener('message', (event) => {
							if (event.data && event.data.type === 'CODE_UPDATE') {
								// 接收到更新，重新生成HTML内容并刷新
								const updatedHtml = document.documentElement.outerHTML
									.replace(
										/<script type="importmap">[^<]*<\\/script>/,
										\`<script type="importmap">\${event.data.importMap}</script>\`
									)
									.replace(
										/<script type="module" id="appSrc">[^<]*<\\/script>/,
										\`<script type="module" id="appSrc">\${event.data.compiledCode}</script>\`
									);
								
								// 使用新内容刷新页面
								document.open();
								document.write(updatedHtml);
								document.close();
							}
						});
						
						// 存储通道引用以便后续清理
						window.reactPlaygroundChannel = channel;
						
						// 在页面关闭时清理
						window.addEventListener('beforeunload', () => {
							if (window.reactPlaygroundChannel) {
								window.reactPlaygroundChannel.close();
							}
						});
					} catch(e) {
						console.error('无法设置更新通道', e);
					}
				`

        try {
          (newTab as any).eval(setupCode)
        }
        catch (e) {
          console.error('无法在新标签页中注入更新代码', e)
        }
      })
    }
  }

  return (
    <div style={{ height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px' }}>
        <button onClick={openInNewTab} style={{ cursor: 'pointer' }}>
          在新标签页打开
        </button>
      </div>
      <iframe
        src={iframeUrl}
        style={{
          width: '100%',
          height: 'calc(100% - 30px)',
          padding: 0,
          border: 'none',
        }}
      />
      {error.length
        ? (
          <Message
            type="error"
            content={error}
          />
        )
        : (
          ''
        )}

      {/* <Editor file={{
            name: 'dist.js',
            value: compiledCode,
            language: 'javascript'
        }}/> */}
    </div>
  )
}
