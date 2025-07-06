'use client';

import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface PdfViewerProps {
    fileUrl: string;
}

export function PdfViewer({ fileUrl }: PdfViewerProps) {
    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    // The workerSrc property is essential for pdfjs-dist to work
    const workerSrc = `//unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js`;

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