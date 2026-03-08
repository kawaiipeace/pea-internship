'use client';
import PanelCodeHighlight from '@/components/panel-code-highlight';
import React from 'react';
import Swal from 'sweetalert2';

const ComponentsSweetAlertsWithFooter = () => {
    const showAlert = async () => {
        (Swal.fire as any)({
            icon: 'question',
            title: 'Sweet Alert',
            text: 'This is a message',
            footer: '<a href="">Why do I have this issue?</a>',
            customClass: 'sweet-alerts',
        });
    };

    return (
        <PanelCodeHighlight
            title="With Footer"
            codeHighlight={`import Swal from 'sweetalert2';

const showAlert = async () => {
    Swal.fire({
        title: 'Sweet Alert',
        footer: '<a href="">Click here</a>',
    });
}`}
        >
            <div className="flex items-center justify-center">
                <button type="button" className="btn btn-primary" onClick={() => showAlert()}>
                    With Footer
                </button>
            </div>
        </PanelCodeHighlight>
    );
};

export default ComponentsSweetAlertsWithFooter;
