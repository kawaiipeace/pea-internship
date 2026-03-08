'use client';
import PanelCodeHighlight from '@/components/panel-code-highlight';
import React from 'react';
import Swal from 'sweetalert2';

const ComponentsSweetAlertsMixin = () => {
    const showAlert = async () => {
        (Swal.fire as any)({
            title: 'Mixin Setup',
            text: 'Using Swal with mixin configuration',
            icon: 'info',
            customClass: 'sweet-alerts',
        });
    };

    return (
        <PanelCodeHighlight
            title="Mixin Setup"
            codeHighlight={`import Swal from 'sweetalert2';

const MyAlert = Swal.mixin({
    customClass: 'sweet-alerts',
    buttonsStyling: false,
});

const showAlert = async () => {
    MyAlert.fire({
        title: 'Mixin Setup',
        text: 'Using mixin configuration',
        icon: 'info',
    });
}`}
        >
            <div className="flex items-center justify-center">
                <button type="button" className="btn btn-primary" onClick={() => showAlert()}>
                    Mixin Setup
                </button>
            </div>
        </PanelCodeHighlight>
    );
};

export default ComponentsSweetAlertsMixin;
