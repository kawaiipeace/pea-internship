'use client';
import PanelCodeHighlight from '@/components/panel-code-highlight';
import React from 'react';
import Swal from 'sweetalert2';

const ComponentsSweetAlertsCustomAnimation = () => {
    const showAlert = async () => {
        (Swal.fire as any)({
            title: 'Custom Animation',
            text: 'This alert has animation',
            icon: 'success',
            customClass: 'sweet-alerts',
        });
    };

    return (
        <PanelCodeHighlight
            title="Custom Animation"
            codeHighlight={`import Swal from 'sweetalert2';

const showAlert = async () => {
    Swal.fire({
        title: 'Custom Animation',
        icon: 'success',
    });
}`}
        >
            <div className="flex items-center justify-center">
                <button type="button" className="btn btn-primary" onClick={() => showAlert()}>
                    Custom Animation
                </button>
            </div>
        </PanelCodeHighlight>
    );
};

export default ComponentsSweetAlertsCustomAnimation;
