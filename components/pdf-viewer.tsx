'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin, DefaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface PdfViewerProps {
    fileUrl: string;
}

function InnerPdfViewer({ fileUrl }: PdfViewerProps) {
    const defaultLayoutPluginInstance = defaultLayoutPlugin();
    // Match the worker version with the API version from the error message
    const workerSrc = `//unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

    return (
        <div className="h-[75vh]">
            <Worker workerUrl={workerSrc}>
                <Viewer
                    fileUrl={fileUrl}
                    plugins={[defaultLayoutPluginInstance]}
                />
            </Worker>
        </div>
    );
}

export function PdfViewer({ fileUrl }: PdfViewerProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return (
            <div className="flex items-center justify-center h-[75vh] bg-gray-50 rounded-lg">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading PDF viewer...</p>
                </div>
            </div>
        );
    }

    return <InnerPdfViewer fileUrl={fileUrl} />;
} 