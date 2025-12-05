import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// STİLLERİ UYGULAMAK İÇİN BU SATIRI EKLEYİN
import './App.css'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>
)