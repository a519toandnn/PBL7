import {
  createEmptyFormData,
  mergeMeasureUnitOptions,
  normalizePriceRows,
  toMedicinePayload,
  validatePriceRows,
} from './AdminScreen';

describe('admin medicine price form helpers', () => {
  it('maps medicine detail prices to editable price rows with measure names', () => {
    const rows = normalizePriceRows([
      { measure_id: 1, measure_name: 'Hộp', price: 6000, is_sell_default: true },
      { measure_id: 2, measure_name: 'Vỉ', price: '12000.00', is_sell_default: false },
    ]);

    expect(rows).toEqual([
      { measure_unit_id: 1, measure_name: 'Hộp', price: '6000', is_sell_default: true },
      { measure_unit_id: 2, measure_name: 'Vỉ', price: '12000.00', is_sell_default: false },
    ]);
  });

  it('submits all valid price rows using measure_unit_id', () => {
    const payload = toMedicinePayload({
      ...createEmptyFormData(),
      title: 'Thuốc test',
      slug: 'thuoc-test',
      prices: [
        { measure_unit_id: 1, measure_name: 'Hộp', price: '6000', is_sell_default: true },
        { measure_unit_id: 2, measure_name: 'Vỉ', price: '12000', is_sell_default: false },
      ],
    });

    expect(payload.prices).toEqual([
      { measure_unit_id: 1, price: 6000, is_sell_default: true },
      { measure_unit_id: 2, price: 12000, is_sell_default: false },
    ]);
  });

  it('validates duplicate measure units before submit', () => {
    const errors = validatePriceRows([
      { measure_unit_id: 1, price: '6000', is_sell_default: true },
      { measure_unit_id: 1, price: '7000', is_sell_default: false },
    ]);

    expect(errors).toEqual(['Mỗi đơn vị tính chỉ được xuất hiện một lần.']);
  });

  it('merges measure unit options found in medicine price rows', () => {
    const options = mergeMeasureUnitOptions(
      [{ id: 1, name: 'Hộp' }],
      [
        { measure_unit_id: 1, measure_name: 'Hộp' },
        { measure_unit_id: 2, measure_name: 'Vỉ' },
      ]
    );

    expect(options).toEqual([
      { id: 1, name: 'Hộp' },
      { id: 2, name: 'Vỉ' },
    ]);
  });
});
