import Source from "gi://GtkSource?version=5";
import Gio from "gi://Gio";
import GLib from "gi://GLib";

const params = {
  xml: {
    extension: "ui",
    placeholder: Gio.resources_lookup_data(
      "/re/sonny/Workbench/welcome.ui",
      Gio.ResourceLookupFlags.NONE
    ),
  },
  blueprint: {
    extension: "blp",
    placeholder: Gio.resources_lookup_data(
      "/re/sonny/Workbench/welcome.blp",
      Gio.ResourceLookupFlags.NONE
    ),
  },
};

export default function panel_ui({ builder, user_datadir, datadir }) {
  const language_manager = new Source.LanguageManager();
  language_manager.set_search_path([
    ...language_manager.get_search_path(),
    GLib.build_filenamev([datadir, "re.sonny.Workbench"]),
  ]);

  const dropdown_ui_lang = builder.get_object("dropdown_ui_lang");

  let mode;
  let source_file;

  // TODO: File a bug libadwaita
  // flat does nothing on GtkDropdown or GtkComboBox or GtkComboBoxText
  dropdown_ui_lang
    .get_first_child()
    .get_first_child()
    .get_style_context()
    .add_class("flat");

  dropdown_ui_lang.connect("changed", setMode);

  const source_view = builder.get_object("source_view_ui");
  const { buffer } = source_view;

  function setMode() {
    mode = dropdown_ui_lang.get_active_id();
    log(mode);
    buffer.set_language(language_manager.get_language(mode));

    const file = Gio.File.new_for_path(
      GLib.build_filenamev([user_datadir, `state.${params[mode].extension}`])
    );

    source_file = new Source.File({
      location: file,
    });

    load();
  }

  setMode();

  buffer.connect("modified-changed", () => {
    const modified = buffer.get_modified();
    if (!modified) return;
    save();
  });

  function load() {
    const file_loader = new Source.FileLoader({
      buffer,
      file: source_file,
    });
    file_loader.load_async(
      GLib.PRIORITY_DEFAULT,
      null,
      null,
      (self, result) => {
        let success;
        try {
          success = file_loader.load_finish(result);
        } catch (err) {
          if (err.code !== Gio.IOErrorEnum.NOT_FOUND) {
            logError(err);
          }
        }
        if (success) buffer.set_modified(false);
        if (!success) reset();
      }
    );
  }

  function save() {
    const file_saver = new Source.FileSaver({
      buffer,
      file: source_file,
    });
    file_saver.save_async(GLib.PRIORITY_DEFAULT, null, null, (self, result) => {
      const success = file_saver.save_finish(result);
      if (success) buffer.set_modified(false);
    });
  }

  function reset() {
    const decoder = new TextDecoder("utf-8");
    const text = decoder.decode(params[mode].placeholder.get_data());
    buffer.set_text(text, -1);
  }

  function get_text() {
    const text = source_view.buffer.text.trim();
    if (mode === "xml" || !text) return text;

    return compileBlueprint(source_file.location.get_path());
  }

  return { reset, source_view, get_text };
}

function compileBlueprint(path) {
  log("compile");

  console.time();

  try {
    const result = GLib.spawn_command_line_sync(
      `blueprint-compiler compile ${path}`
    );
    let [, stdout, stderr] = result;
    const [, , , status] = result;

    if (status !== 0) {
      if (stderr instanceof Uint8Array)
        stderr = new TextDecoder().decode(stderr);

      throw new Error(stderr);
    }

    if (stdout instanceof Uint8Array) stdout = new TextDecoder().decode(stdout);

    console.timeEnd();

    return stdout;
  } catch (e) {
    logError(e);
    return "";
  }
}
