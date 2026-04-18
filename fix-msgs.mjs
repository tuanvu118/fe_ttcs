import fs from 'fs'

const p = './src/admin/tasks/DetailHTSK.jsx'
const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/)

lines[258] =
  "      message.warning('Ch\u1ecdn tr\u00ean b\u1ea3ng ho\u1eb7c d\u00e1n \u00edt nh\u1ea5t m\u1ed9t m\u00e3 sinh vi\u00ean (m\u1ed7i d\u00f2ng m\u1ed9t MSV).')"
lines[263] =
  "      message.error('Thi\u1ebfu \u0111\u01a1n v\u1ecb ho\u1eb7c h\u1ecdc k\u1ef3.')"
lines[277] =
  '          `C\u00e1c MSV sau kh\u00f4ng t\u1ed3n t\u1ea1i trong \u0111\u01a1n v\u1ecb \u1edf h\u1ecdc k\u1ef3 n\u00e0y (ho\u1eb7c ch\u01b0a l\u00e0 th\u00e0nh vi\u00ean): ${preview}${more}`,'
lines[310] =
  "      message.error('M\u00e3 sinh vi\u00ean kh\u00f4ng t\u1ed3n t\u1ea1i trong \u0111\u01a1n v\u1ecb \u1edf h\u1ecdc k\u1ef3 n\u00e0y ho\u1eb7c ch\u01b0a l\u00e0 th\u00e0nh vi\u00ean.')"

fs.writeFileSync(p, lines.join('\n'), 'utf8')
