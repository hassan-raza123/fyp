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

  const inputClasses = 'block w-full px-4 py-3 rounded-lg border-2 transition-all duration-200'
  const inputBaseStyle: React.CSSProperties = {
    borderColor: 'var(--gray-200)',
    backgroundColor: 'var(--white)',
  }
  const inputFocusStyle: React.CSSProperties = {
    borderColor: 'var(--brand-primary)',
    '--tw-ring-color': 'rgba(38, 40, 149, 0.2)',
  } as React.CSSProperties
  const labelClasses = 'block text-sm font-medium mb-1.5'
  const labelStyle: React.CSSProperties = {
    color: 'var(--text-heading)',
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {status.type && (
        <div 
          className='p-4 rounded-lg border'
          style={{
            backgroundColor: status.type === 'success' 
              ? 'rgba(252, 153, 40, 0.1)' 
              : 'rgba(0, 0, 0, 0.05)',
            color: status.type === 'success' ? 'var(--brand-secondary-dark)' : 'var(--black)',
            borderColor: status.type === 'success' 
              ? 'rgba(252, 153, 40, 0.2)' 
              : 'rgba(0, 0, 0, 0.1)',
          } as React.CSSProperties}
        >
          {status.message}
        </div>
      )}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <div className='space-y-1'>
          <label htmlFor='name' className={labelClasses} style={labelStyle}>
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
            style={inputBaseStyle}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, inputBaseStyle)}
            placeholder='John Doe'
            minLength={2}
            maxLength={50}
          />
        </div>
        <div className='space-y-1'>
          <label htmlFor='email' className={labelClasses} style={labelStyle}>
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
            style={inputBaseStyle}
            onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={(e) => Object.assign(e.target.style, inputBaseStyle)}
            placeholder='john@example.com'
            pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
            title="Please enter a valid email address"
          />
        </div>
      </div>

      <div className='space-y-1'>
        <label htmlFor='subject' className={labelClasses} style={labelStyle}>
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
          style={inputBaseStyle}
          onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
          onBlur={(e) => Object.assign(e.target.style, inputBaseStyle)}
          placeholder='How can we help you?'
          minLength={5}
          maxLength={100}
        />
      </div>

      <div className='space-y-1'>
        <label htmlFor='message' className={labelClasses} style={labelStyle}>
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
          style={inputBaseStyle}
          onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
          onBlur={(e) => Object.assign(e.target.style, inputBaseStyle)}
          placeholder='Tell us more about your inquiry...'
          minLength={10}
          maxLength={1000}
        />
      </div>

      <div>
        <button
          type='submit'
          disabled={isLoading}
          className='w-full flex justify-center items-center py-3 px-6 rounded-lg text-white font-semibold focus:outline-none focus:ring-2 shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
          style={{
            backgroundColor: isLoading ? 'var(--gray-400)' : 'var(--brand-primary)',
            '--tw-ring-color': 'rgba(38, 40, 149, 0.3)',
            color: 'var(--white)',
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = 'var(--brand-primary-dark)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = 'var(--brand-primary)';
            }
          }}
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