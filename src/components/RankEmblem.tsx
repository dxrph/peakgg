interface RankEmblemProps {
  index: number;
}

const paths = [
  ["M32 4 56 18 52 48 32 60 12 48 8 18Z", "M20 25 32 17 44 25 41 42 32 48 23 42Z"],
  ["M32 3 58 21 48 55 32 62 16 55 6 21Z", "M17 24 32 11 47 24 42 47 32 55 22 47Z"],
  ["M32 3 60 18 52 49 32 63 12 49 4 18Z", "M14 22 26 26 32 12 38 26 50 22 45 46 32 55 19 46Z"],
  ["M32 2 58 14 62 37 48 59 32 64 16 59 2 37 6 14Z", "M12 20 25 23 32 9 39 23 52 20 46 47 32 57 18 47Z"],
  ["M32 2 57 11 63 32 52 55 32 64 12 55 1 32 7 11Z", "M11 18 24 22 32 7 40 22 53 18 47 46 32 58 17 46Z"],
  ["M32 1 58 9 64 31 54 54 32 65 10 54 0 31 6 9Z", "M9 16 23 21 32 5 41 21 55 16 48 46 32 60 16 46Z"],
  ["M32 0 59 8 65 30 55 55 32 66 9 55-1 30 5 8Z", "M7 14 22 20 32 3 42 20 57 14 49 47 32 62 15 47Z"],
];

export default function RankEmblem({ index }: RankEmblemProps) {
  const [outer, inner] = paths[index] ?? paths[0];
  return (
    <svg className="rank-emblem" viewBox="0 0 64 66" aria-hidden="true">
      <path className="rank-emblem-outer" d={outer} />
      <path className="rank-emblem-inner" d={inner} />
      <path className="rank-emblem-core" d="m32 20 8 12-8 13-8-13Z" />
    </svg>
  );
}