'use client';
import PanelCodeHighlight from '@/components/panel-code-highlight';
import React from 'react';
import Swal from 'sweetalert2';

const ComponentsSweetAlertsTitle = () => {
    const showAlert = async () => {
        (Swal.fire as any)({
            title: 'Oops...',
            text: 'Something went wrong!',
            icon: 'error',
            customClass: 'sweet-alerts',
        });
    };

    return (
        <PanelCodeHighlight
            title="Title with text"
            codeHighlight={`import Swal from 'sweetalert2';

const showAlert = async () => {
    Swal.fire({
        title: 'Oops...',
        text: 'Something went wrong!',
        icon: 'error',
    });
}`}
        >
            <div className="flex items-center justify-center">
                <button type="button" className="btn btn-danger" onClick={() => showAlert()}>
                    Title with text
                </button>
            </div>
        </PanelCodeHighlight>
    );
};

export default ComponentsSweetAlertsTitle;
