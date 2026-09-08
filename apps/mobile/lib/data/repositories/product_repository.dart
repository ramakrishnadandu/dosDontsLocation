import '../../core/network/api_client.dart';
import '../../domain/entities/product.dart';

class ProductRepository {
  final ApiClient _client;

  ProductRepository(this._client);

  Future<List<Product>> search(String query) async {
    final json = await _client.get('/products/search', query: {'q': query});
    return ((json['items'] as List<dynamic>?) ?? const [])
        .map((e) => Product.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Product> getById(String id) async {
    final json = await _client.get('/products/$id');
    return Product.fromJson(json as Map<String, dynamic>);
  }

  /// Only ever returns currently-active deals - see
  /// packages/contracts/src/product.ts#isDealActive.
  Future<List<Deal>> getDeals(String productId) async {
    final json = await _client.get('/products/$productId/deals');
    return ((json['items'] as List<dynamic>?) ?? const [])
        .map((e) => Deal.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
