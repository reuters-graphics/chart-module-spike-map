export default (opts) => {
  const lon0 = opts[0][0];
  let lon1 = opts[1][0];
  let lat0 = opts[0][1];
  let lat1 = opts[1][1];

  // to cross antimeridian w/o ambiguity
  if (lon0 > 0 && lon1 < 0) {
    lon1 += 360;
  }

  // to make lat span unambiguous
  if (lat0 > lat1) {
    const tmp = lat0;
    lat0 = lat1;
    lat1 = tmp;
  }

  const dlon4 = (lon1 - lon0) / 4;

  return {
    type: 'Polygon',
    coordinates: [
      [
        [lon0, lat0],
        [lon0, lat1],
        [lon0 + dlon4, lat1],
        [lon0 + 2 * dlon4, lat1],
        [lon0 + 3 * dlon4, lat1],
        [lon1, lat1],
        [lon1, lat0],
        [lon1 - dlon4, lat0],
        [lon1 - 2 * dlon4, lat0],
        [lon1 - 3 * dlon4, lat0],
        [lon0, lat0],
      ],
    ],
  };
};
