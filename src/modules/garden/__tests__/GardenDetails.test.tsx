const mockBack = jest.fn();

jest.mock("expo-router", () => ({ useRouter: () => ({ back: mockBack }) }));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));
jest.mock("../../auth/hooks/useSession", () => ({
  useSession: () => ({ user: { id: "u1" } }),
}));
jest.mock("../hooks/useGardens", () => ({ useGardens: jest.fn() }));
jest.mock("../hooks/useGardenMembers", () => ({ useGardenMembers: jest.fn() }));
jest.mock("../api/gardenApi", () => ({ createInvite: jest.fn() }));
jest.mock("../gardenManagement", () => ({
  renameAndRefresh: jest.fn(),
  deleteAndRefresh: jest.fn(),
  leaveAndRefresh: jest.fn(),
  removeMemberAndRefresh: jest.fn(),
  transferAndRefresh: jest.fn(),
}));

import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert, Share } from "react-native";
import { createInvite } from "../api/gardenApi";
import {
    deleteAndRefresh,
    leaveAndRefresh,
    removeMemberAndRefresh,
    renameAndRefresh,
    transferAndRefresh,
} from "../gardenManagement";
import { useGardenMembers } from "../hooks/useGardenMembers";
import { useGardens } from "../hooks/useGardens";
import { GardenDetails } from "../ui/GardenDetails";

const mockGardens = useGardens as jest.Mock;
const mockMembers = useGardenMembers as jest.Mock;
const mockInvite = createInvite as jest.Mock;
const mockDelete = deleteAndRefresh as jest.Mock;
const mockLeave = leaveAndRefresh as jest.Mock;
const mockRemove = removeMemberAndRefresh as jest.Mock;
const mockRename = renameAndRefresh as jest.Mock;
const mockTransfer = transferAndRefresh as jest.Mock;

const members = [
  { userId: "u1", displayName: "Anna", role: "owner", joinedAt: "1" },
  { userId: "u2", displayName: "Bartek", role: "member", joinedAt: "2" },
];

let alertSpy: jest.SpyInstance;
let shareSpy: jest.SpyInstance;

async function setup(role: "owner" | "member") {
  mockGardens.mockReturnValue({
    data: [{ id: "g1", name: "Dom", role }],
    isPending: false,
  });
  mockMembers.mockReturnValue({
    data: members,
    isPending: false,
    isError: false,
  });
  return render(<GardenDetails gardenId="g1" />);
}

// Wywołuje przycisk potwierdzenia (destructive) z ostatnio pokazanego okna Alert
async function confirmAlert() {
  const buttons = alertSpy.mock.calls[0][2] ?? [];
  const confirm = buttons.find(
    (button: { style?: string }) => button.style === "destructive",
  );
  await act(async () => {
    await confirm?.onPress?.();
  });
}

beforeEach(() => {
  alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  shareSpy = jest
    .spyOn(Share, "share")
    .mockResolvedValue({ action: "sharedAction" } as never);
});

afterEach(() => {
  alertSpy.mockRestore();
  shareSpy.mockRestore();
  jest.resetAllMocks();
});

describe("GardenDetails", () => {
  test("właściciel widzi zarządzanie ogrodem", async () => {
    const utils = await setup("owner");

    expect(utils.getByText("Anna (gardens.you)")).toBeTruthy();
    expect(utils.getByText("Bartek")).toBeTruthy();
    expect(utils.getByTestId("remove-member-u2")).toBeTruthy();
    expect(utils.queryByTestId("remove-member-u1")).toBeNull();
    expect(utils.getByTestId("transfer-owner-u2")).toBeTruthy();
    expect(utils.queryByTestId("transfer-owner-u1")).toBeNull();
    expect(utils.getByTestId("rename-button")).toBeTruthy();
    expect(utils.getByTestId("generate-code")).toBeTruthy();
    expect(utils.getByTestId("delete-garden")).toBeTruthy();
    expect(utils.queryByTestId("leave-garden")).toBeNull();
  });

  test("członek widzi tylko listę osób i opuszczenie ogrodu", async () => {
    const utils = await setup("member");

    expect(utils.getByText("Bartek")).toBeTruthy();
    expect(utils.queryByTestId("remove-member-u2")).toBeNull();
    expect(utils.queryByTestId("transfer-owner-u2")).toBeNull();
    expect(utils.queryByTestId("rename-button")).toBeNull();
    expect(utils.queryByTestId("generate-code")).toBeNull();
    expect(utils.queryByTestId("delete-garden")).toBeNull();
    expect(utils.getByTestId("leave-garden")).toBeTruthy();
  });

  test("wygenerowany kod można udostępnić", async () => {
    mockInvite.mockResolvedValue({ ok: true, data: "ABCD1234EF" });
    const utils = await setup("owner");

    await fireEvent.press(utils.getByTestId("generate-code"));
    const code = await utils.findByTestId("invite-code");
    expect(code.props.children).toBe("ABCD1234EF");

    await fireEvent.press(utils.getByTestId("share-code"));
    expect(shareSpy).toHaveBeenCalledWith({
      message: expect.stringContaining("ABCD1234EF"),
    });
  });

  test("usunięcie ogrodu wymaga potwierdzenia, a potem wraca do listy", async () => {
    mockDelete.mockResolvedValue({ ok: true, data: null });
    const utils = await setup("owner");

    await fireEvent.press(utils.getByTestId("delete-garden"));
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(mockDelete).not.toHaveBeenCalled();

    await confirmAlert();
    expect(mockDelete).toHaveBeenCalledWith("g1");
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
  });

  test("błąd przy usuwaniu: pokazuje komunikat i nie wraca", async () => {
    mockDelete.mockResolvedValue({ ok: false, error: "notAllowed" });
    const utils = await setup("owner");

    await fireEvent.press(utils.getByTestId("delete-garden"));
    await confirmAlert();

    expect(await utils.findByText("gardens.errors.notAllowed")).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });

  test("członek opuszcza ogród po potwierdzeniu", async () => {
    mockLeave.mockResolvedValue({ ok: true, data: null });
    const utils = await setup("member");

    await fireEvent.press(utils.getByTestId("leave-garden"));
    await confirmAlert();

    expect(mockLeave).toHaveBeenCalledWith("g1");
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
  });

  test("właściciel usuwa członka po potwierdzeniu i zostaje na ekranie", async () => {
    mockRemove.mockResolvedValue({ ok: true, data: null });
    const utils = await setup("owner");

    await fireEvent.press(utils.getByTestId("remove-member-u2"));
    await confirmAlert();

    expect(mockRemove).toHaveBeenCalledWith("g1", "u2");
    expect(mockBack).not.toHaveBeenCalled();
  });

  test("przekazanie własności po potwierdzeniu chowa stary kod", async () => {
    mockInvite.mockResolvedValue({ ok: true, data: "ABCD1234EF" });
    mockTransfer.mockResolvedValue({ ok: true, data: null });
    const utils = await setup("owner");
    await fireEvent.press(utils.getByTestId("generate-code"));
    expect(await utils.findByTestId("invite-code")).toBeTruthy();

    await fireEvent.press(utils.getByTestId("transfer-owner-u2"));
    expect(alertSpy.mock.calls[0][1]).toContain('"name":"Bartek"');
    await confirmAlert();

    expect(mockTransfer).toHaveBeenCalledWith("g1", "u2");
    expect(utils.queryByTestId("invite-code")).toBeNull();
    expect(mockBack).not.toHaveBeenCalled();
  });

  test("błąd przekazania: pokazuje komunikat", async () => {
    mockTransfer.mockResolvedValue({ ok: false, error: "notMember" });
    const utils = await setup("owner");

    await fireEvent.press(utils.getByTestId("transfer-owner-u2"));
    await confirmAlert();

    expect(await utils.findByText("gardens.errors.notMember")).toBeTruthy();
  });

  test("zmiana nazwy: zapisuje nową nazwę i zamyka edycję", async () => {
    mockRename.mockResolvedValue({ ok: true, data: null });
    const utils = await setup("owner");

    await fireEvent.press(utils.getByTestId("rename-button"));
    await fireEvent.changeText(utils.getByTestId("rename-input"), "Nowa");
    await fireEvent.press(utils.getByTestId("rename-save"));

    await waitFor(() => expect(mockRename).toHaveBeenCalledWith("g1", "Nowa"));
    await waitFor(() => expect(utils.queryByTestId("rename-input")).toBeNull());
  });

  test("zmiana nazwy: pusta nazwa pokazuje błąd i nie wysyła zapytania", async () => {
    const utils = await setup("owner");

    await fireEvent.press(utils.getByTestId("rename-button"));
    await fireEvent.changeText(utils.getByTestId("rename-input"), "   ");
    await fireEvent.press(utils.getByTestId("rename-save"));

    expect(utils.getByText("gardens.errors.invalidName")).toBeTruthy();
    expect(mockRename).not.toHaveBeenCalled();
  });
});
