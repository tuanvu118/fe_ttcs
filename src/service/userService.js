import { apiRequest } from './apiClient'

export async function registerUser(form) {
  const formData = new FormData()

  formData.append('full_name', form.fullName.trim())
  formData.append('email', form.email.trim())
  formData.append('password', form.password)
  formData.append('student_id', form.studentId.trim())
  formData.append('class_name', form.className.trim())

  return apiRequest('/users', {
    method: 'POST',
    body: formData,
  })
}
