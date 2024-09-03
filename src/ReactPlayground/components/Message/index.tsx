import { useEffect, useState } from 'react';
import classnames from 'classnames';
import styles from './index.module.scss';

export interface MessageProps {
	type: 'error' | 'warn';
	content: string;
}

export const Message: React.FC<MessageProps> = (props) => {
	const { type, content } = props;
	const [visible, setVisible] = useState(false);
	useEffect(() => {
		if (content.length) {
			setVisible(true);
		} else {
			setVisible(false);
		}
	}, [content]);

	return visible ? (
		<div className={classnames(styles.msg, styles[type])}>
			<pre dangerouslySetInnerHTML={{ __html: content }}></pre>
			<button
				className={styles.dismiss}
				onClick={() => setVisible(false)}>
				X
			</button>
		</div>
	) : null;
};
