'use client';
import PanelCodeHighlight from '@/components/panel-code-highlight';
import { useSuppressTippyWarning } from '@/hooks/useSuppressTippyWarning';
import Tippy from '@tippyjs/react';
import React from 'react';

const ElementsPopoversDismissible = () => {
    useSuppressTippyWarning();
    return (
        <PanelCodeHighlight
            title="Dismissible popover"
            codeHighlight={`import Tippy from '@tippyjs/react';

<Tippy trigger="click" content="Popover on left" placement="left">
    <button type="button" data-dismissable="true" className="btn btn-dark">
        Popover on left
    </button>
</Tippy>`}
        >
            <div className="mb-5">
                <div className="flex w-full justify-center gap-4">
                    <Tippy trigger="click" content="Popover on left" placement="left">
                        <button type="button" data-dismissable="true" className="btn btn-dark">
                            Popover on left
                        </button>
                    </Tippy>
                </div>
            </div>
        </PanelCodeHighlight>
    );
};

export default ElementsPopoversDismissible;
