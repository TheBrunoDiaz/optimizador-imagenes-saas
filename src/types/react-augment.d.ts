import 'react'

// `webkitdirectory` permite seleccionar una carpeta en el diálogo de archivos.
// No está en los tipos de React por defecto; lo añadimos aquí.
declare module 'react' {
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string
    directory?: string
  }
}
