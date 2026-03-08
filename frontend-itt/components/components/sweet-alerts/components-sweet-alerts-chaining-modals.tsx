'use client';
import PanelCodeHighlight from '@/components/panel-code-highlight';
import React from 'react';
import Swal from 'sweetalert2';

const ComponentsSweetAlertsChainingModals = () => {
    const showAlert = async () => {
        (Swal.fire as any)({
            title: 'First Modal',
            text: 'Click OK to see the next',
            icon: 'question',
        }).then((result: any) => {
            if (result.isConfirmed) {
                (Swal.fire as any)({
                    title: 'Second Modal',
                    text: 'Another alert!',
                    icon: 'info',
                });
            }
        });
    };

    return (
        <PanelCodeHighlight
            title="Chaining Modals"
            codeHighlight={`import Swal from 'sweetalert2';

const showAlert = async () => {
    Swal.fire({...}).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({...});
        }
    });
}`}
        >
            <div className="flex items-center justify-center">
                <button type="button" className="btn btn-primary" onClick={() => showAlert()}>
                    Chaining Modals
                </button>
            </div>
        </PanelCodeHighlight>
    );
};

export default ComponentsSweetAlertsChainingModals;
