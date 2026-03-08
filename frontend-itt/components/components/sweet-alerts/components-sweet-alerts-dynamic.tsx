'use client';
import PanelCodeHighlight from '@/components/panel-code-highlight';
import React from 'react';
import Swal from 'sweetalert2';

const ComponentsSweetAlertsDynamic = () => {
    const types = ['success', 'error', 'warning', 'info', 'question'];

    const showAlert = async (type: string) => {
        (Swal.fire as any)({
            icon: type as any,
            title: `${type.charAt(0).toUpperCase() + type.slice(1)} Alert!`,
            text: `This is a ${type} alert`,
            customClass: 'sweet-alerts',
        });
    };

    return (
        <PanelCodeHighlight
            title="Dynamic Alerts"
            codeHighlight={`import Swal from 'sweetalert2';

const showAlert = async (type: string) => {
    Swal.fire({
        icon: type as any,
        title: type.toUpperCase(),
        text: 'This is a dynamic alert',
    });
}`}
        >
            <div className="grid grid-cols-5 gap-2">
                {types.map((type) => (
                    <button
                        key={type}
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => showAlert(type)}
                    >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                ))}
            </div>
        </PanelCodeHighlight>
    );
};

export default ComponentsSweetAlertsDynamic;
