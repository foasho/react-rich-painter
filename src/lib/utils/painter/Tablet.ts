class Tablet {
  static plugin(): any {
    // wacom対応
    let plugin = document.querySelector(
      'object[type="application/x-wacomtabletplugin"]',
    ) as any;
    if (!plugin) {
      plugin = document.createElement("object");
      plugin.type = "application/x-wacomtabletplugin";
      plugin.style.position = "absolute";
      plugin.style.top = "-1000px";
      document.body.appendChild(plugin);
    }
    return plugin;
  }

  static pen(): any {
    const plugin = Tablet.plugin();
    return plugin.penAPI;
  }

  static pressure(): number {
    const pen = Tablet.pen();
    return pen && pen.pointerType ? pen.pressure : 1;
  }

  static isEraser(): boolean {
    const pen = Tablet.pen();
    return pen ? pen.isEraser : false;
  }
}

export { Tablet };
