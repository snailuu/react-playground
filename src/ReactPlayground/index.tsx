import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import Header from './components/Header';
import CodeEditor from './components/CodeEditor';
import Preview from './components/Preview';

import './index.scss';
import { useContext } from 'react';
import { PlaygroundContext } from './PlaygroundContext';

export default function ReactPlayground() {
	const { theme } = useContext(PlaygroundContext);

	return (
		<div
			className={theme}
			style={{ height: `calc(100vh - 50px)` }}>
			<Header />
			<Allotment defaultSizes={[100, 100]}>
				<Allotment.Pane minSize={0}>
					<CodeEditor />
				</Allotment.Pane>
				<Allotment.Pane minSize={0}>
					<Preview />
				</Allotment.Pane>
			</Allotment>
		</div>
	);
}
