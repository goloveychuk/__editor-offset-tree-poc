import { KeyboardEvent } from 'react';


function getStyle(element: HTMLElement, properties: string[]): { [key: string]: string } {
    const cssStyleDeclaration = window.getComputedStyle(element);
    return properties.reduce((acc, property) => {
        acc[property] = cssStyleDeclaration.getPropertyValue(property);
        return acc;
    }, {});
}

function setStyle(element: HTMLElement, style: { [key: string]: string }) {
    Object.keys(style).forEach(key => {
        element.style.setProperty(key, style[key]);
    });
}

function flatten(array: Array<any>) {
    return array.reduce((acc, element) => {
        if (element instanceof Array) {
            flatten(element).forEach((e: any) => acc.push(e));
        } else {
            acc.push(element);
        }
        return acc;
    }, []);
}

const css = {
    wrapper: {
        "box-sizing": "border-box",
        overflow: "hidden",
    },
    overlay: {
        "box-sizing": "border-box",
        "border-color": "transparent",
        "border-style": "solid",
        // color: "transparent",
        position: "absolute",
        "white-space": "pre-wrap",
        "word-wrap": "break-word",
        overflow: "hidden",
        width: "100%",
        "z-index": 1000
    },
    textarea: {
        background: "transparent",
        "box-sizing": "border-box",
        outline: "none",
        position: "relative",
        height: "100%",
        width: "100%",
        margin: "0px",
    },
};

const properties = {
    wrapper: [
        "background",
        "display",
        "margin",
    ],
    overlay: [
        "font-family",
        "font-size",
        "font-weight",
        "line-height",
        "padding",
        "border-width",
    ],
};


export class Textoverlay {
    private origStyle: { [key: string]: string };
    private observer: MutationObserver;
    private wrapperDisplay: string;

    private overlay: HTMLDivElement;
    private textarea: HTMLTextAreaElement;
    private wrapper: HTMLDivElement;

    onChange: (ev: Event) => void;

    getContainer() {
        return this.overlay
    }

    static createWrapper(textarea: HTMLTextAreaElement, parentElement: Element) {
        const position = getStyle(textarea, ["position"]).position;
        const wrapper = document.createElement("div");
        wrapper.className = "textoverlay-wrapper";
        setStyle(wrapper, Object.assign({}, getStyle(textarea, properties.wrapper), css.wrapper, {
            position: position === "static" ? "relative" : position,
        }));
        parentElement.insertBefore(wrapper, textarea);
        parentElement.removeChild(textarea);
        wrapper.appendChild(textarea);
        return wrapper;
    }

    static createOverlay(textarea: HTMLTextAreaElement, wrapper: HTMLDivElement) {
        const overlay = document.createElement("div");
        overlay.className = "textoverlay";

        setStyle(overlay, Object.assign({}, css.overlay, getStyle(textarea, properties.overlay)));
        wrapper.insertBefore(overlay, textarea);
        return overlay;
    }

    constructor(textarea: HTMLTextAreaElement, onChange: (ev: Event) => void) {
        const parentElement = textarea.parentElement;
        if (!parentElement) {
            throw new Error("textarea must in DOM tree");
        }
        this.onChange = onChange
        this.origStyle = getStyle(textarea, Object.keys(css.textarea));

        this.wrapper = Textoverlay.createWrapper(textarea, parentElement);
        this.overlay = Textoverlay.createOverlay(textarea, this.wrapper);

        setStyle(textarea, css.textarea);
        this.textarea = textarea;

        this.textarea.addEventListener("keypress", this.handleInput);
        this.textarea.addEventListener("scroll", this.handleScroll);
        this.observer = new MutationObserver(this.handleResize);
        this.observer.observe(this.textarea, {
            attributes: true,
            attributeFilter: ["style"],
        });

        this.wrapperDisplay = getStyle(this.wrapper, ["display"])["display"];
    }

    destroy() {
        this.textarea.removeEventListener("keypress", this.handleInput);
        this.textarea.removeEventListener("scroll", this.handleScroll);
        this.observer.disconnect();

        setStyle(this.textarea, this.origStyle);

        this.overlay.remove();
        this.textarea.remove();
        const parentElement = this.wrapper.parentElement;
        if (parentElement) {
            parentElement.insertBefore(this.textarea, this.wrapper);
            this.wrapper.remove();
        }
    }
  

    sync() {
        setStyle(this.overlay, { top: `${-this.textarea.scrollTop}px` });
        const props = this.wrapperDisplay === "block" ? ["height"] : ["height", "width"];
        setStyle(this.wrapper, getStyle(this.textarea, props));
    }
    

    handleInput = (ev: Event) => {
        this.sync() ///todo
        this.onChange(ev)
    }

    handleScroll = () => {
        this.sync()
    }

    handleResize = () => {
        this.sync()        
    }
}