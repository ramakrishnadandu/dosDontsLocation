import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../data/repositories/product_repository.dart';
import '../../domain/entities/product.dart';

class ProductComparisonScreen extends StatefulWidget {
  final List<String> productIds;

  const ProductComparisonScreen({super.key, required this.productIds});

  @override
  State<ProductComparisonScreen> createState() => _ProductComparisonScreenState();
}

class _ProductComparisonScreenState extends State<ProductComparisonScreen> {
  List<Product> _products = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final repo = context.read<ProductRepository>();
    _products = await Future.wait(widget.productIds.map(repo.getById));
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return Scaffold(
      appBar: AppBar(title: const Text('Compare products')),
      body: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          columns: [
            const DataColumn(label: Text('Attribute')),
            ..._products.map((p) => DataColumn(label: Text(p.title))),
          ],
          rows: [
            _row('Brand', (p) => p.brand ?? '-'),
            _row('Price', (p) => p.price != null ? '${p.currency ?? ''} ${p.price}' : '-'),
            _row('Rating', (p) => p.rating != null ? '★ ${p.rating}' : '-'),
          ],
        ),
      ),
    );
  }

  DataRow _row(String label, String Function(Product) valueOf) {
    return DataRow(cells: [
      DataCell(Text(label)),
      ..._products.map((p) => DataCell(Text(valueOf(p)))),
    ]);
  }
}
