'use client';
import PanelCodeHighlight from '@/components/panel-code-highlight';
import React from 'react';
import Swal from 'sweetalert2';

const ComponentsSweetAlertsCustomStyle = () => {
    const showAlert = async () => {
        (Swal.fire as any)({
            title: 'Custom Styled Alert',
            text: 'This alert has custom styling',
            icon: 'success',
            customClass: 'sweet-alerts',
        });
    };

    return (
        <PanelCodeHighlight
            title="Custom Style"
            codeHighlight={`import Swal from 'sweetalert2';

const showAlert = async () => {
    Swal.fire({
        title: 'Custom Styled Alert',
        text: 'This alert has custom styling',
        icon: 'success',
    });
}`}
        >
            <div className="flex items-center justify-center">
                <button type="button" className="btn btn-primary" onClick={() => showAlert()}>
                    Custom Style
                </button>
            </div>
        </PanelCodeHighlight>
    );
};

export default ComponentsSweetAlertsCustomStyle;
