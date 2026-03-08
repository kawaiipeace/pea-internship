'use client';
import PanelCodeHighlight from '@/components/panel-code-highlight';
import React from 'react';
import Swal from 'sweetalert2';

const ComponentsSweetAlertsHtml = () => {
    const showAlert = async () => {
        (Swal.fire as any)({
            icon: 'info',
            title: 'HTML content',
            html: '<p>This is <strong>HTML</strong> content!</p>',
            customClass: 'sweet-alerts',
        });
    };

    return (
        <PanelCodeHighlight
            title="HTML content"
            codeHighlight={`import Swal from 'sweetalert2';

const showAlert = async () => {
    Swal.fire({
        icon: 'info',
        title: 'HTML content',
        html: '<p>This is <strong>HTML</strong> content!</p>',
    });
}`}
        >
            <div className="flex items-center justify-center">
                <button type="button" className="btn btn-info" onClick={() => showAlert()}>
                    Show HTML
                </button>
            </div>
        </PanelCodeHighlight>
    );
};

export default ComponentsSweetAlertsHtml;
