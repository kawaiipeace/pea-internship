'use client';
import PanelCodeHighlight from '@/components/panel-code-highlight';
import React from 'react';
import Swal from 'sweetalert2';

const ComponentsSweetAlertsRtl = () => {
    const showAlert = async () => {
        (Swal.fire as any)({
            title: 'السلام عليكم!',
            text: 'هذا نص باللغة العربية',
            icon: 'success',
            customClass: 'sweet-alerts',
        });
    };

    return (
        <PanelCodeHighlight
            title="RTL Support"
            codeHighlight={`import Swal from 'sweetalert2';

const showAlert = async () => {
    Swal.fire({
        title: 'السلام عليكم!',
        text: 'هذا نص باللغة العربية',
        icon: 'success',
    });
}`}
        >
            <div className="flex items-center justify-center">
                <button type="button" className="btn btn-primary" onClick={() => showAlert()}>
                    RTL Support
                </button>
            </div>
        </PanelCodeHighlight>
    );
};

export default ComponentsSweetAlertsRtl;
