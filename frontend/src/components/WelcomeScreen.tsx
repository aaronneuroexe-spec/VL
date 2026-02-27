import { Hash, Mic, Users, Zap } from 'lucide-react';

export function WelcomeScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-700 text-center px-8">
      <div className="mb-8">
        <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap size={36} className="text-indigo-400" />
        </div>
        <h1 className="text-white text-2xl font-bold mb-2">Добро пожаловать в VoxLink</h1>
        <p className="text-gray-400 text-sm max-w-sm">
          Выбери канал в сайдбаре чтобы начать общение, или выбери гильдию слева.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-sm w-full">
        {[
          { icon: Hash, label: 'Текстовые каналы', desc: 'Общайся с командой' },
          { icon: Mic,  label: 'Голосовые каналы', desc: 'LiveKit SFU' },
          { icon: Users, label: 'Гильдии', desc: 'Твои сообщества' },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="bg-gray-800/60 rounded-xl p-4 text-center">
            <Icon size={20} className="text-indigo-400 mx-auto mb-2" />
            <div className="text-white text-xs font-medium mb-1">{label}</div>
            <div className="text-gray-500 text-xs">{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
