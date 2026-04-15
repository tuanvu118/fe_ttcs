import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const modules = {
  toolbar: [
    [{ 'header': [1, 2, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
    ['link'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent',
  'link'
];

export default function RichTextEditor({ value, onChange, placeholder }) {
  return (
    <div className="rich-text-editor-wrapper">
      <ReactQuill 
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || "Nhập mô tả chi tiết tại đây..."}
      />
      <style>{`
        .rich-text-editor-wrapper {
          width: 100%;
          background: #ffffff;
        }
        .ql-container {
          min-height: 200px;
          font-family: inherit;
          font-size: 15px;
        }
        .ql-editor {
          min-height: 200px;
        }
        .ql-toolbar.ql-snow {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          border-color: #e2e8f0;
          background: #f8fafc;
        }
        .ql-container.ql-snow {
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          border-color: #e2e8f0;
        }
      `}</style>
    </div>
  );
}
