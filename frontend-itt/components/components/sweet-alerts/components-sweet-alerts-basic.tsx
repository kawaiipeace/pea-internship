'use client';
import PanelCodeHighlight from '@/components/panel-code-highlight';
import React from 'react';
import Swal from 'sweetalert2';

const ComponentsSweetAlertsBasic = () => {
    const showAlert = async () => {
        (Swal.fire as any)({
            title: 'Saved successfully',
            customClass: 'sweet-alerts',
        });
    };

    return (
        <PanelCodeHighlight
            title="Basic message"
            codeHighlight={`import Swal from 'sweetalert2';

const showAlert = async () => {
    Swal.fire({
        title: 'Saved successfully',
        customClass: 'sweet-alerts',
    });
}

<button type="button" className="btn btn-primary" onClick={() => showAlert()}>
    Basic message
</button>`}
        >
            <div className="mb-5">
                <div className="flex items-center justify-center">
                    <button type="button" className="btn btn-primary" onClick={() => showAlert()}>
                        Basic message
                    </button>
                </div>
            </div>
        </PanelCodeHighlight>
    );
};

export default ComponentsSweetAlertsBasic;
