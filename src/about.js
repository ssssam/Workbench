import Gtk from "gi://Gtk";
import { gettext as _ } from "gettext";
import GLib from "gi://GLib";
import Adw from "gi://Adw";

import {
  getGIRepositoryVersion,
  getGjsVersion,
  getGLibVersion,
} from "./troll/src/util.js";
import { getFlatpakInfo } from "./util.js";

export default function About({ application, datadir, version }) {
  const flatpak_info = getFlatpakInfo();

  const system_information = `
${GLib.get_os_info("ID")} ${GLib.get_os_info("VERSION_ID")}

GJS ${getGjsVersion()}
Adw ${getGIRepositoryVersion(Adw)}
GTK ${getGIRepositoryVersion(Gtk)}
GLib ${getGLibVersion()}
flatpak ${flatpak_info.get_string("Instance", "flatpak-version")}
`.trim();

  const dialog = new Gtk.AboutDialog({
    application,
    authors: ["Sonny Piers https://sonny.re"],
    artists: ["Tobias Bernard <tbernard@gnome.org>"],
    comments: _("Learn and prototype with\nGNOME technologies"),
    copyright: "Copyright 2022 Sonny Piers",
    license_type: Gtk.License.GPL_3_0_ONLY,
    version,
    transient_for: application.get_active_window(),
    modal: true,
    website: "https://workbench.sonny.re",
    logo_icon_name: "re.sonny.Workbench",
    // TRANSLATORS: eg. 'Translator Name <your.email@domain.com>' or 'Translator Name https://website.example'
    translator_credits: _("translator-credits"),
    system_information,
  });
  // dialog.add_credit_section("Contributors", [
  //   // Add yourself as
  //   // "John Doe",
  //   // or
  //   // "John Doe <john@example.com>",
  //   // or
  //   // "John Doe https://john.com",
  // ]);
  dialog.present();

  return { dialog };
}
