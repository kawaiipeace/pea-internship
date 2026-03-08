'use client';
import PanelCodeHighlight from '@/components/panel-code-highlight';
import React from 'react';
import Swal from 'sweetalert2';

const ComponentsSweetAlertsSuccess = () => {
    const showAlert = async () => {
        (Swal.fire as any)({
            icon: 'success',
            title: 'Success!',
            text: 'Your action was completed successfully.',
            customClass: 'sweet-alerts',
        });
    };

    return (
        <PanelCodeHighlight
            title="Success message"
            codeHighlight={`import Swal from 'sweetalert2';

const showAlert = async () => {
    Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Your action was completed successfully.',
    });
}`}
        >
            <div className="flex items-center justify-center">
                <button type="button" className="btn btn-success" onClick={() => showAlert()}>
                    Success
                </button>
            </div>
        </PanelCodeHighlight>
    );
};

export default ComponentsSweetAlertsSuccess;
