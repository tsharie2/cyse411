import DOMPurify from "dompurify";

function Comment({ html }) {
  const safeHtml = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}

export default Comment;
