'use client';
import PanelCodeHighlight from '@/components/panel-code-highlight';
import { useSuppressTippyWarning } from '@/hooks/useSuppressTippyWarning';
import Tippy from '@tippyjs/react';
import React from 'react';

const ElementsTooltipsHtml = () => {
    useSuppressTippyWarning();
    return (
        <PanelCodeHighlight
            title="HTML"
            codeHighlight={`import Tippy from '@tippyjs/react';

<Tippy content="Bolded content">
    <button type="button" data-dismissable="true" className="btn btn-dark">
        Tooltip on HTML
    </button>
</Tippy>`}
        >
            <div className="mb-5">
                <div className="flex w-full justify-center gap-4">
                    <Tippy content={<strong>Bolded content</strong>}>
                        <button type="button" data-dismissable="true" className="btn btn-dark">
                            Tooltip on HTML
                        </button>
                    </Tippy>
                </div>
            </div>
        </PanelCodeHighlight>
    );
};

export default ElementsTooltipsHtml;
