import ExpoModulesCore
import UIKit

/// Opens Instagram's story composer with a Gruntz card as the background, the way
/// Meta documents it: the image goes on the pasteboard under Instagram's own keys
/// (expiring after five minutes) and `instagram-stories://share` opens the composer.
/// Nothing is uploaded by Gruntz; the athlete still chooses whether to post.
public class GruntzStoryShareModule: Module {
  private static let scheme = "instagram-stories://share"

  public func definition() -> ModuleDefinition {
    Name("GruntzStoryShare")

    /// True when Instagram is installed and can take a story. Needs
    /// `instagram-stories` in LSApplicationQueriesSchemes.
    Function("isAvailable") { () -> Bool in
      guard let url = URL(string: Self.scheme) else { return false }
      return UIApplication.shared.canOpenURL(url)
    }

    /// `fileUri` is a PNG the app just rendered. Resolves false when Instagram is
    /// missing or the file cannot be read, so the caller can fall back to the share sheet.
    AsyncFunction("shareBackground") { (fileUri: String, appId: String, topColor: String, bottomColor: String, promise: Promise) in
      guard
        !appId.isEmpty,
        let url = URL(string: "\(Self.scheme)?source_application=\(appId)"),
        let file = URL(string: fileUri),
        file.isFileURL,
        let data = try? Data(contentsOf: file),
        UIImage(data: data) != nil
      else {
        promise.resolve(false)
        return
      }
      DispatchQueue.main.async {
        guard UIApplication.shared.canOpenURL(url) else {
          promise.resolve(false)
          return
        }
        UIPasteboard.general.setItems(
          [[
            "com.instagram.sharedSticker.backgroundImage": data,
            "com.instagram.sharedSticker.backgroundTopColor": topColor,
            "com.instagram.sharedSticker.backgroundBottomColor": bottomColor,
          ]],
          options: [.expirationDate: Date().addingTimeInterval(5 * 60)]
        )
        UIApplication.shared.open(url, options: [:]) { opened in promise.resolve(opened) }
      }
    }
  }
}
