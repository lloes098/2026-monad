import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "./components/AppLayout";
import { ChatPage } from "./pages/ChatPage";
import { ChatsListPage } from "./pages/ChatsListPage";
import { DiscoverPage } from "./pages/DiscoverPage";
import { MatchesPage } from "./pages/MatchesPage";
import { PeerProfilePage } from "./pages/PeerProfilePage";
import { ProfileEditPage } from "./pages/ProfileEditPage";
import { ProfilePage } from "./pages/ProfilePage";
import { WelcomePage } from "./pages/WelcomePage";

export function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<WelcomePage />} />
      <Route element={<AppLayout />}>
        <Route index element={<DiscoverPage />} />
        <Route path="chats" element={<ChatsListPage />} />
        <Route path="matches" element={<MatchesPage />} />
        <Route path="profile/edit" element={<ProfileEditPage />} />
        <Route path="profile/peer/:peerAddress" element={<PeerProfilePage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="chat/:peerAddress" element={<ChatPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
