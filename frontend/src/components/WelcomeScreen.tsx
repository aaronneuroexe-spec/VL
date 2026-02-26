import { Mic, MessageSquare, Users, Calendar } from 'lucide-react';

export function WelcomeScreen() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="max-w-2xl text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to VoxLink
          </h1>
          <p className="text-xl text-gray-600">
            Your modern voice communication platform for communities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <Mic className="w-8 h-8 text-primary-600 mb-4 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Voice Channels
            </h3>
            <p className="text-gray-600">
              High-quality voice communication with WebRTC technology
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <MessageSquare className="w-8 h-8 text-primary-600 mb-4 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Text Chat
            </h3>
            <p className="text-gray-600">
              Real-time messaging with file sharing and rich formatting
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <Users className="w-8 h-8 text-primary-600 mb-4 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Community
            </h3>
            <p className="text-gray-600">
              Connect with your community members in organized channels
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <Calendar className="w-8 h-8 text-primary-600 mb-4 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Events
            </h3>
            <p className="text-gray-600">
              Schedule and manage community events and activities
            </p>
          </div>
        </div>

        <div className="text-gray-500">
          <p>Select a channel from the sidebar to start chatting</p>
        </div>
      </div>
    </div>
  );
}
