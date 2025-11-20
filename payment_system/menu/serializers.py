from rest_framework import serializers
from .models import Menu, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class MenuSerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    category_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Menu
        fields = ['id', 'name', 'price', 'store', 'category_id', 'category_name']
        extra_kwargs = {
            'store': {'read_only': True},
        }

    def _get_request_store(self):
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        store = getattr(user, 'store', None)
        if not store:
            raise serializers.ValidationError({"store": "ユーザーに店舗が設定されていません。"})
        return store

    def _get_or_create_uncategorized(self, store) -> Category:
        uncategorized, _ = Category.objects.get_or_create(store=store, name="未分類")
        return uncategorized

    def _resolve_category(self, category_id, store):
        if category_id is None:
            return self._get_or_create_uncategorized(store)
        try:
            return Category.objects.get(pk=category_id, store=store)
        except Category.DoesNotExist:
            raise serializers.ValidationError({"category_id": "指定したカテゴリが存在しません。"})

    def create(self, validated_data):
        category_id = validated_data.pop('category_id', None)
        store = validated_data.get('store') or self._get_request_store()
        category = self._resolve_category(category_id, store)
        validated_data['category'] = category
        return super().create(validated_data)

    def update(self, instance, validated_data):
        category_id = validated_data.pop('category_id', None)
        if 'category_id' in self.initial_data:
            store = instance.store
            category = self._resolve_category(category_id, store)
            validated_data['category'] = category
        return super().update(instance, validated_data)

    def get_category_name(self, obj) -> str:
        return obj.category.name if obj.category_id is not None and obj.category else "未分類"
