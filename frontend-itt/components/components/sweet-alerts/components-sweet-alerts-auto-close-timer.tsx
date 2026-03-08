'use client';
import PanelCodeHighlight from '@/components/panel-code-highlight';
import React from 'react';
import Swal from 'sweetalert2';

const ComponentsSweetAlertsAutoCloseTimer = () => {
    const showAlert = async () => {
        let timerInterval: ReturnType<typeof setInterval> | undefined;
        (Swal.fire as any)({
            title: 'Auto close alert!',
            html: 'I will close in <b></b> milliseconds.',
            timer: 2000,
            timerProgressBar: true,
            didOpen: () => {
                const b: any = Swal.getHtmlContainer()?.querySelector('b');
                timerInterval = setInterval(() => {
                    if (b) b.textContent = Swal.getTimerLeft();
                }, 100);
            },
            willClose: () => {
                if (timerInterval) clearInterval(timerInterval);
            },
        }).then((result: any) => {
            if (result.dismiss === Swal.DismissReason.timer) {
                console.log('I was closed by the timer');
            }
        });
    };

    return (
        <PanelCodeHighlight
            title="Message with auto close timer"
            codeHighlight={`import Swal from 'sweetalert2';

const showAlert = async () => {
    let timerInterval;
    Swal.fire({
        title: 'Auto close alert!',
        timer: 2000,
        timerProgressBar: true,
        didOpen: () => {
            timerInterval = setInterval(() => {
                // update timer display
            }, 100);
        },
        willClose: () => {
            clearInterval(timerInterval);
        },
    });
}`}
        >
            <div className="flex items-center justify-center">
                <button type="button" className="btn btn-primary" onClick={() => showAlert()}>
                    Auto Close Timer
                </button>
            </div>
        </PanelCodeHighlight>
    );
};

export default ComponentsSweetAlertsAutoCloseTimer;
