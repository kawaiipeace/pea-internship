'use client';
import PanelCodeHighlight from '@/components/panel-code-highlight';
import React from 'react';
import Swal from 'sweetalert2';

const ComponentsSweetAlertsWarning = () => {
    const showAlert = async () => {
        (Swal.fire as any)({
            icon: 'warning',
            title: 'Warning!',
            text: 'This is a warning message.',
            customClass: 'sweet-alerts',
        });
    };

    return (
        <PanelCodeHighlight
            title="Warning message"
            codeHighlight={`import Swal from 'sweetalert2';

const showAlert = async () => {
    Swal.fire({
        icon: 'warning',
        title: 'Warning!',
        text: 'This is a warning message.',
    });
}`}
        >
            <div className="flex items-center justify-center">
                <button type="button" className="btn btn-warning" onClick={() => showAlert()}>
                    Warning
                </button>
            </div>
        </PanelCodeHighlight>
    );
};

export default ComponentsSweetAlertsWarning;
