import { Fragment } from 'react';
import { splitHighlight } from '../../utils/text';

interface HighlightProps {
  text: string;
  query: string;
}

export function Highlight({ text, query }: HighlightProps) {
  const segments = splitHighlight(text, query);
  return (
    <>
      {segments.map((segment, index) => (
        <Fragment key={index}>
          {segment.match ? <mark>{segment.text}</mark> : segment.text}
        </Fragment>
      ))}
    </>
  );
}
