import { bootstrap } from "../bootstrap";
import { ensureRTL } from "../../ui/rtl";

jest.mock("../../ui/rtl", () => ({
  ensureRTL: jest.fn(),
}));

describe("bootstrap", () => {
  it("runs app bootstrap side effects", async () => {
    await bootstrap();
    expect(ensureRTL).toHaveBeenCalledTimes(1);
  });
});
