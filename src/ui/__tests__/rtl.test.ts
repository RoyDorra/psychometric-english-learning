import { ensureRTL } from "../rtl";
import { I18nManager, Platform } from "react-native";

describe("ensureRTL", () => {
  const originalIsRTL = I18nManager.isRTL;
  const originalPlatform = Platform.OS;

  afterEach(() => {
    (I18nManager as any).isRTL = originalIsRTL;
    (Platform as any).OS = originalPlatform;
  });

  it("forces RTL only once and sets document dir on web", () => {
    (I18nManager as any).isRTL = false;
    const allowSpy = jest.spyOn(I18nManager, "allowRTL").mockImplementation(() => {});
    const forceSpy = jest.spyOn(I18nManager, "forceRTL").mockImplementation(() => {});
    (Platform as any).OS = "web";
    const originalDocument = (global as any).document;
    (global as any).document = { documentElement: {} };

    ensureRTL();
    ensureRTL(); // second call should be no-op

    expect(allowSpy).toHaveBeenCalledTimes(1);
    expect(forceSpy).toHaveBeenCalledTimes(1);
    expect((global as any).document.documentElement.dir).toBe("rtl");

    (global as any).document = originalDocument;
    allowSpy.mockRestore();
    forceSpy.mockRestore();
  });
});
