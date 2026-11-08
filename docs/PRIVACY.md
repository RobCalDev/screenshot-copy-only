# Public release privacy audit

The 1.1.1 release retains **RobCalDev** as the public publishing identity,
including its GitHub noreply commit address, copyright attribution, extension
UUID and project URLs. Generic GNOME compatibility and test-environment
information remains to help users assess support.

The review covered all public Git branches/tags and their reachable history,
public profile fields, release descriptions, downloaded release ZIP contents,
and the current upload archive. No private account identity, personal email,
local user/workspace paths, hostnames, hardware identifiers or credentials were
found in the reviewed public materials. Earlier local workspace history is not
part of the public repository.

The README image was captured in an isolated test session, with no personal
desktop content. The current PNG contains only image data; ancillary creation
time/software metadata was removed without changing its pixels. Earlier
revisions retain the test-session screenshot, not an image of a personal desktop.

The upload ZIP uses an explicit file allowlist. It contains only metadata,
three runtime JavaScript modules, the stylesheet, schema XML, LICENSE and NOTICE.
It contains no Git history, screenshots, local configuration, logs or development
scripts. ZIP entries have normalized timestamps/permissions and no archive or
entry comments, extra fields or absolute paths.

The extension writes captured images to the clipboard only at the user's request
and does not read existing clipboard data, contact network services or collect
telemetry. This audit covers this project's public materials; GitHub itself
publishes normal account, commit and release metadata under the public handle.
