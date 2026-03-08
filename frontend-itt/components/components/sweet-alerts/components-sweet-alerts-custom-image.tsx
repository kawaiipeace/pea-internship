'use client';
import PanelCodeHighlight from '@/components/panel-code-highlight';
import React from 'react';
import Swal from 'sweetalert2';

const ComponentsSweetAlertsCustomImage = () => {
    const showAlert = async () => {
        (Swal.fire as any)({
            title: 'Custom Image',
            imageUrl: '/assets/images/notification-01.jpeg',
            imageWidth: 200,
            imageHeight: 200,
            customClass: 'sweet-alerts',
        });
    };

    return (
        <PanelCodeHighlight
            title="Custom Image"
            codeHighlight={`import Swal from 'sweetalert2';

const showAlert = async () => {
    Swal.fire({
        title: 'Custom Image',
        imageUrl: '/image.png',
        imageWidth: 200,
        imageHeight: 200,
    });
}`}
        >
            <div className="flex items-center justify-center">
                <button type="button" className="btn btn-primary" onClick={() => showAlert()}>
                    Custom Image
                </button>
            </div>
        </PanelCodeHighlight>
    );
};

export default ComponentsSweetAlertsCustomImage;
