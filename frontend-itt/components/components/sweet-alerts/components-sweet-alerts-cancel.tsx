'use client';
import PanelCodeHighlight from '@/components/panel-code-highlight';
import React from 'react';
import Swal from 'sweetalert2';

const ComponentsSweetAlertsCancel = () => {
    const showAlert = async () => {
        (Swal.fire as any)({
            title: 'Are you sure?',
            text: 'You will not be able to recover this!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, keep it',
            customClass: 'sweet-alerts',
        }).then((result: any) => {
            if (result.isConfirmed) {
                (Swal.fire as any)({
                    title: 'Deleted!',
                    text: 'Your item has been deleted.',
                    icon: 'success',
                    customClass: 'sweet-alerts',
                });
            }
        });
    };

    return (
        <PanelCodeHighlight
            title="Confirm delete"
            codeHighlight={`import Swal from 'sweetalert2';

const showAlert = async () => {
    Swal.fire({
        title: 'Are you sure?',
        showCancelButton: true,
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire('Deleted!');
        }
    });
}`}
        >
            <div className="flex items-center justify-center">
                <button type="button" className="btn btn-danger" onClick={() => showAlert()}>
                    Delete Confirmation
                </button>
            </div>
        </PanelCodeHighlight>
    );
};

export default ComponentsSweetAlertsCancel;
