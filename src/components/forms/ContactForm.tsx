'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface FormData {
  name: string
  email: string
  subject: string
  message: string
}

export default function ContactForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })

  // Add useEffect to auto-hide success message
  useEffect(() => {
    if (status.type === 'success') {
      const timer = setTimeout(() => {
        setStatus({ type: null, message: '' });
      }, 3000); // Hide after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [status.type]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus({ type: null, message: '' })

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      setStatus({ type: 'success', message: 'Message sent successfully! We will get back to you soon.' })
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      })
    } catch {
      setStatus({ type: 'error', message: 'Failed to send message. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const inputClasses = 'block w-full px-4 py-3 rounded-lg border-2 border-gray-200 shadow-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:ring-opacity-50 transition-all duration-200 bg-white/50 hover:border-purple-200'
  const labelClasses = 'block text-sm font-medium text-gray-700 mb-1.5'

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {status.type && (
        <div className={`p-4 rounded-lg ${status.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {status.message}
        </div>
      )}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <div className='space-y-1'>
          <label htmlFor='name' className={labelClasses}>
            Your Name
          </label>
          <input
            type='text'
            id='name'
            name='name'
            value={formData.name}
            onChange={handleChange}
            required
            className={inputClasses}
            placeholder='John Doe'
            minLength={2}
            maxLength={50}
          />
        </div>
        <div className='space-y-1'>
          <label htmlFor='email' className={labelClasses}>
            Email Address
          </label>
          <input
            type='email'
            id='email'
            name='email'
            value={formData.email}
            onChange={handleChange}
            required
            className={inputClasses}
            placeholder='john@example.com'
            pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
            title="Please enter a valid email address"
          />
        </div>
      </div>

      <div className='space-y-1'>
        <label htmlFor='subject' className={labelClasses}>
          Subject
        </label>
        <input
          type='text'
          id='subject'
          name='subject'
          value={formData.subject}
          onChange={handleChange}
          required
          className={inputClasses}
          placeholder='How can we help you?'
          minLength={5}
          maxLength={100}
        />
      </div>

      <div className='space-y-1'>
        <label htmlFor='message' className={labelClasses}>
          Message
        </label>
        <textarea
          id='message'
          name='message'
          value={formData.message}
          onChange={handleChange}
          required
          rows={6}
          className={inputClasses}
          placeholder='Tell us more about your inquiry...'
          minLength={10}
          maxLength={1000}
        />
      </div>

      <div>
        <button
          type='submit'
          disabled={isLoading}
          className='w-full flex justify-center items-center py-3 px-6 rounded-lg text-white font-medium
            bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 
            hover:from-purple-700 hover:via-purple-600 hover:to-indigo-700
            focus:outline-none focus:ring-4 focus:ring-purple-200
            shadow-lg shadow-purple-500/20
            transform hover:scale-[1.02] active:scale-[0.98]
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
        >
          {isLoading ? (
            <>
              <Loader2 className='animate-spin -ml-1 mr-2 h-5 w-5' />
              Sending...
            </>
          ) : (
            'Send Message'
          )}
        </button>
      </div>
    </form>
  )
} 