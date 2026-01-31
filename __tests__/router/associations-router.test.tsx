import {
  act,
  fireEvent,
  renderRouter,
  waitFor,
} from "expo-router/testing-library";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WORDS } from "@/src/data/words";

jest.mock("@/src/hooks/useAuth", () => {
  const React = require("react");
  const value = {
    user: { id: "test-user", email: "test@example.com", passwordHash: "", createdAt: "" },
    session: { user: { id: "test-user" }, token: "token" },
    initializing: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  };
  const AuthContext = React.createContext(value);
  const AuthProvider = ({ children }: { children: React.ReactNode }) => (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
  const useAuth = () => React.useContext(AuthContext);
  return { AuthProvider, useAuth };
});

const word = WORDS[0];

const renderAssociations = () => {
  const rendered = renderRouter("./app", {
    initialUrl: `/word/${word.id}/associations`,
  });
  jest.useRealTimers();
  return rendered;
};

describe("WordAssociationsScreen (router)", () => {
  beforeEach(async () => {
    await (AsyncStorage as any).clear?.();
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders tabs and empty states", async () => {
    const { getByText, getAllByText } = await renderAssociations();

    await waitFor(() => expect(getByText("הוסיפו אסוציאציה")).toBeTruthy());

    fireEvent.press(getByText("שמור"));
    await waitFor(() =>
      expect(
        getByText("עדיין לא שמרתם אסוציאציות למילה הזאת."),
      ).toBeTruthy(),
    );

    const privateTabs = getAllByText("פרטי");
    fireEvent.press(privateTabs[privateTabs.length - 1]);
    expect(
      getByText("עדיין אין אסוציאציות פרטיות. הוסיפו אחת!"),
    ).toBeTruthy();
  });

  it("enables submit when text is present and creates public associations", async () => {
    const { getByPlaceholderText, getByText, queryByText } = await renderAssociations();
    const input = getByPlaceholderText("רמז קצר שיעזור לזכור");
    const submitText = getByText("הוסף");
    let submitButton = submitText.parent;
    while (submitButton && !submitButton.props.onPress && submitButton.parent) {
      submitButton = submitButton.parent;
    }
    const buttonToPress = submitButton ?? submitText;

    fireEvent.press(buttonToPress as any);
    expect(queryByText("ציבורית")).toBeNull();

    await act(async () => {
      fireEvent.changeText(input, "ראשונה");
    });

    await act(async () => {
      if (buttonToPress.props?.onPress) {
        await buttonToPress.props.onPress();
      } else {
        fireEvent.press(buttonToPress as any);
      }
    });

    await waitFor(() => expect(getByText("ראשונה")).toBeTruthy());
  });

  it("supports liking, saving, and preserves ordering by likes", async () => {
    const { getByPlaceholderText, getByText, getAllByText } = await renderAssociations();
    const input = getByPlaceholderText("רמז קצר שיעזור לזכור");
    const submitText = getByText("הוסף");
    let submitButton = submitText.parent;
    while (submitButton && !submitButton.props.onPress && submitButton.parent) {
      submitButton = submitButton.parent;
    }
    const buttonToPress = submitButton ?? submitText;

    const addAssociation = async (text: string) => {
      await act(async () => {
        fireEvent.changeText(input, text);
      });
      await act(async () => {
        if (buttonToPress.props?.onPress) {
          await buttonToPress.props.onPress();
        } else {
          fireEvent.press(buttonToPress as any);
        }
      });
      await waitFor(() => expect(getByText(text)).toBeTruthy());
    };

    await addAssociation("ראשונה");
    await addAssociation("שניה");

    const likeButtons = getAllByText("👍 0");
    await act(async () => {
      fireEvent.press(likeButtons[1]);
    });

    await waitFor(() => expect(getByText("👍 1")).toBeTruthy());

    const orderedAssociations = getAllByText(/^(ראשונה|שניה)$/);
    const firstRendered = orderedAssociations[0];
    expect(firstRendered.props.children).toBe("ראשונה");

    const saveButtons = getAllByText("+ שמור");
    const saveButton = saveButtons[0];
    await act(async () => {
      fireEvent.press(saveButton);
    });

    await waitFor(() => expect(getByText("✔︎ נשמר")).toBeTruthy());

    fireEvent.press(getByText("שמור"));
    await waitFor(() => expect(getByText("ראשונה")).toBeTruthy());
    expect(getByText("הסר")).toBeTruthy();
    expect(() => getByText("נשמר")).toThrow();

    await act(async () => {
      fireEvent.press(getByText("הסר"));
    });

    await waitFor(() =>
      expect(
        getByText("עדיין לא שמרתם אסוציאציות למילה הזאת."),
      ).toBeTruthy(),
    );
  });
});
