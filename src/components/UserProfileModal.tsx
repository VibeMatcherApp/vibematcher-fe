import { PieChart } from './PieChart';

interface UserProfileModalProps {
  nickname: string;
  tags: { blockchain: string[]; assetType: string[] };
  tokenDistribution: { [key: string]: number };
  onClose: () => void;
}

export const UserProfileModal = ({ nickname, tags, tokenDistribution, onClose }: UserProfileModalProps) => {
  const chartData = Object.entries(tokenDistribution).map(([name, value]) => ({
    name,
    value: Number(value),
  }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl max-w-md w-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-900 hover:text-gray-700"
          style={{ position: 'absolute', top: '1rem', right: '1rem' }}
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{nickname}</h2>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.blockchain.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center justify-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
            {tags.assetType.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center justify-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Token Distribution</h3>
          <div className="aspect-square max-w-[300px] mx-auto">
            <PieChart data={chartData} />
          </div>
        </div>
      </div>
    </div>
  );
};
