'use client';

import { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocs() {
  const [spec, setSpec] = useState<any>(null);

  useEffect(() => {
    fetch('/api/docs')
      .then((response) => response.json())
      .then((data) => setSpec(data));
  }, []);

  if (!spec) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-xl'>Loading API Documentation...</div>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-4'>
      <div className='mb-4'>
        <h1 className='text-2xl font-bold mb-2'>API Documentation</h1>
        <p className='text-gray-600'>
          You can test all APIs directly from this interface. Click on any
          endpoint to expand it and try it out!
        </p>
      </div>
      <SwaggerUI
        spec={spec}
        supportedSubmitMethods={['get', 'post', 'put', 'delete', 'patch']}
        docExpansion='list'
        defaultModelsExpandDepth={3}
        defaultModelExpandDepth={3}
        displayRequestDuration={true}
        filter={true}
        showExtensions={true}
        showCommonExtensions={true}
      />
    </div>
  );
}
