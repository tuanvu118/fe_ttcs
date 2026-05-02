import { useEffect, useState } from 'react'
import { Modal, Form, Input, InputNumber, Upload } from 'antd'
import { 
  UploadSimple, 
  PencilSimple,
  EnvelopeSimple,
  CalendarBlank
} from '@phosphor-icons/react'

const { TextArea } = Input

export default function UnitEditModal({ isOpen, unit, isAdmin, isSubmitting, onClose, onSubmit }) {
  const [form] = Form.useForm()
  const [logoFileList, setLogoFileList] = useState([])
  const [coverFileList, setCoverFileList] = useState([])

  useEffect(() => {
    if (isOpen && unit) {
      form.setFieldsValue({
        name: unit.name,
        type: unit.type,
        introduction: unit.introduction,
        established_year: unit.established_year,
        email: unit.email,
        fb_url: unit.fb_url
      })
      
      if (unit.logo) {
        setLogoFileList([{
          uid: '-1',
          name: 'logo.png',
          status: 'done',
          url: unit.logo,
        }])
      } else {
        setLogoFileList([])
      }

      if (unit.cover_url) {
        setCoverFileList([{
          uid: '-2',
          name: 'cover.png',
          status: 'done',
          url: unit.cover_url,
        }])
      } else {
        setCoverFileList([])
      }
    }
  }, [isOpen, unit, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        ...values,
        logo: logoFileList[0]?.originFileObj || (logoFileList[0]?.url ? null : 'remove'),
        cover: coverFileList[0]?.originFileObj || (coverFileList[0]?.url ? null : 'remove')
      }
      onSubmit(payload)
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const handleLogoChange = ({ fileList: newFileList }) => {
    setLogoFileList(newFileList.slice(-1))
  }

  const handleCoverChange = ({ fileList: newFileList }) => {
    setCoverFileList(newFileList.slice(-1))
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ background: '#eff6ff', padding: '6px', borderRadius: '8px', display: 'flex' }}>
            <PencilSimple size={20} color="#2563eb" weight="bold" />
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Chỉnh sửa thông tin đơn vị</span>
        </div>
      }
      open={isOpen}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={isSubmitting}
      width={800}
      okText="Lưu thay đổi"
      cancelText="Hủy"
      centered
      styles={{ body: { padding: '0 24px 24px' } }}
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: '1rem' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '1.5rem', marginBottom: '1rem' }}>
          <Form.Item
            label={<strong>Ảnh bìa đơn vị (21:6)</strong>}
            style={{ marginBottom: '0.5rem' }}
          >
            <Upload
              listType="picture-card"
              fileList={coverFileList}
              className="cover-uploader"
              onChange={handleCoverChange}
              beforeUpload={() => false}
            >
              {coverFileList.length < 1 && (
                <div style={{ color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <UploadSimple size={24} />
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tải ảnh bìa</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item
            label={<strong>Logo</strong>}
            style={{ marginBottom: '0.5rem' }}
          >
            <Upload
              listType="picture-card"
              fileList={logoFileList}
              onChange={handleLogoChange}
              beforeUpload={() => false}
            >
              {logoFileList.length < 1 && (
                <div style={{ color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <UploadSimple size={24} />
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tải Logo</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1rem' }}>
          <Form.Item
            name="email"
            label={<strong>Email liên hệ</strong>}
            rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
            style={{ marginBottom: '0.5rem' }}
          >
            <Input 
              prefix={<EnvelopeSimple size={18} color="#94a3b8" />}
              placeholder="clb.abc@hcmute.edu.vn" 
              style={{ height: '40px', borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            name="established_year"
            label={<strong>Năm thành lập</strong>}
            style={{ marginBottom: '0.5rem' }}
          >
            <InputNumber 
              prefix={<CalendarBlank size={18} color="#94a3b8" />}
              style={{ width: '100%', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center' }} 
              placeholder="Ví dụ: 2020" 
              min={1900} 
              max={new Date().getFullYear()} 
            />
          </Form.Item>
        </div>

        <Form.Item
          name="fb_url"
          label={<strong>Facebook URL</strong>}
          style={{ marginBottom: '1rem' }}
        >
          <Input 
            prefix={<CalendarBlank size={18} color="#94a3b8" />}
            placeholder="https://fb.com/clb.abc" 
            style={{ height: '40px', borderRadius: '8px' }}
          />
        </Form.Item>

        <Form.Item
          name="introduction"
          label={<strong>Giới thiệu chi tiết</strong>}
          style={{ marginBottom: '0' }}
        >
          <TextArea 
            rows={8} 
            placeholder="Viết một bài giới thiệu ấn tượng về đơn vị của bạn..." 
            style={{ borderRadius: '12px', padding: '12px' }}
          />
        </Form.Item>
      </Form>
      <style>{`
        .cover-uploader .ant-upload-select {
          width: 100% !important;
          height: 120px !important;
          border-radius: 12px !important;
          background: #f8fafc !important;
          border: 2px dashed #e2e8f0 !important;
        }
        .ant-upload-list-picture-card-container {
          width: 100% !important;
          height: 120px !important;
        }
        .ant-upload-list-item {
          border-radius: 12px !important;
        }
        .ant-form-item-label {
          padding-bottom: 4px !important;
        }
        .ant-form-item-label label {
          font-size: 0.85rem !important;
        }
      `}</style>
    </Modal>
  )
}
