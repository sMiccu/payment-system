from django.db import models
from control.models import Store
# Create your models here.
class Menu(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    price = models.IntegerField()
    store = models.ForeignKey(Store, on_delete=models.CASCADE, null=False, related_name='menu')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name
